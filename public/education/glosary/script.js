import { GLOSSARY_DATA } from './glossary_data.js';
import * as framerMotion from 'https://esm.run/framer-motion';

const { motion, AnimatePresence, animate } = framerMotion; 

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const glossaryContentElement = document.getElementById('glossary-content');
    const searchInput = document.getElementById('search-input');
    const searchClearButton = document.getElementById('search-clear-button');

    renderGlossary(GLOSSARY_DATA);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm) {
            searchClearButton.classList.remove('hidden');
        } else {
            searchClearButton.classList.add('hidden');
        }
        const filteredData = filterGlossaryData(searchTerm);
        renderGlossary(filteredData, searchTerm);
    });

    searchClearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchClearButton.classList.add('hidden');
        renderGlossary(GLOSSARY_DATA, '');
        searchInput.focus();
        lucide.createIcons(); 
    });

    function filterGlossaryData(searchTerm) {
        if (!searchTerm) return GLOSSARY_DATA;

        return GLOSSARY_DATA.map(category => {
            if (category.type === 'terms') {
                const filteredItems = category.items.filter(item => 
                    item.term.toLowerCase().includes(searchTerm) || 
                    item.definition.toLowerCase().includes(searchTerm) ||
                    (item.note && item.note.toLowerCase().includes(searchTerm)) ||
                    (item.sources && item.sources.some(source => source.text.toLowerCase().includes(searchTerm)))
                );
                return { ...category, items: filteredItems };
            } else if (category.type === 'section' || category.type === 'accordion_section') {
                let isMatch = category.title.toLowerCase().includes(searchTerm);
                const content = category.content;

                if (content.purpose && content.purpose.toLowerCase().includes(searchTerm)) isMatch = true;
                if (content.functionText && content.functionText.toLowerCase().includes(searchTerm)) isMatch = true;
                if (content.overview && content.overview.toLowerCase().includes(searchTerm)) isMatch = true;
                
                if (content.keyComponents && content.keyComponents.list.some(c => c.name.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm))) isMatch = true;
                if (content.polkadotJsApiUsage && content.polkadotJsApiUsage.list && content.polkadotJsApiUsage.list.some(c => c.name.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm))) isMatch = true;
                if (content.coreFeatures && content.coreFeatures.list.some(c => c.name.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm))) isMatch = true;
                if (content.relationshipWithPolkadot && content.relationshipWithPolkadot.list && content.relationshipWithPolkadot.list.some(c => c.name.toLowerCase().includes(searchTerm) || c.description.toLowerCase().includes(searchTerm))) isMatch = true;

                if (content.steps && content.steps.some(s => s.title.toLowerCase().includes(searchTerm) || s.description.toLowerCase().includes(searchTerm))) isMatch = true;
                if (content.keyTools && content.keyTools.list.some(tool => tool.toLowerCase().includes(searchTerm))) isMatch = true;
                if (content.sources && content.sources.some(source => source.text.toLowerCase().includes(searchTerm))) isMatch = true;


                return isMatch ? category : null; 
            }
            return category; 
        }).filter(category => category !== null && (category.items ? category.items.length > 0 : true));
    }

    function highlightText(text, searchTerm) {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="bg-pink-500/30 text-pink-300 rounded px-0.5">$1</mark>');
    }

    function renderGlossary(data, searchTerm = '') {
        glossaryContentElement.innerHTML = ''; 

        if (data.length === 0 && searchTerm) {
            glossaryContentElement.innerHTML = `<p class="text-slate-400 text-center py-10 text-xl">No results found for "${highlightText(searchTerm, searchTerm)}".</p>`;
            return;
        }
        if (data.length === 0 && !searchTerm && GLOSSARY_DATA.length > 0) {
             glossaryContentElement.innerHTML = `<p class="text-slate-400 text-center py-10 text-xl">No terms loaded. Check glossary_data.js</p>`;
             return;
        }


        data.forEach((category, index) => {
            const categoryId = `category-${category.id}-${index}`;
            const section = document.createElement('section');
            section.id = categoryId;
            section.className = 'bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl fade-in';
            section.style.animationDelay = `${index * 0.05}s`;

            const title = document.createElement('h2');
            title.className = 'text-2xl sm:text-3xl font-semibold mb-6 border-b-2 border-pink-500/50 pb-3 text-pink-400';
            title.innerHTML = highlightText(category.title, searchTerm);
            section.appendChild(title);

            if (category.highlight) {
                const highlightElement = document.createElement('p');
                highlightElement.className = 'highlight-bar mb-6 text-lg';
                highlightElement.innerHTML = highlightText(category.highlight, searchTerm);
                section.appendChild(highlightElement);
            }

            if (category.type === 'terms') {
                const list = document.createElement('ul');
                list.className = 'space-y-6';
                category.items.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.className = 'border-l-4 border-slate-700 pl-4 py-2 hover:border-pink-500 transition-colors duration-300';
                    
                    const term = document.createElement('h3');
                    term.className = 'text-xl font-semibold text-slate-100 mb-1';
                    term.innerHTML = highlightText(item.term, searchTerm);
                    listItem.appendChild(term);

                    const definition = document.createElement('p');
                    definition.className = 'text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none';
                    definition.innerHTML = highlightText(item.definition, searchTerm);
                    listItem.appendChild(definition);

                    if (item.note) {
                        const note = document.createElement('p');
                        note.className = 'text-xs text-slate-400 mt-2 italic';
                        note.innerHTML = highlightText(item.note, searchTerm);
                        listItem.appendChild(note);
                    }

                    appendSources(listItem, item.sources, searchTerm);
                    list.appendChild(listItem);
                });
                section.appendChild(list);
            } else if (category.type === 'section') {
                renderSectionContent(section, category.content, searchTerm);
            } else if (category.type === 'accordion_section') {
                renderAccordionSection(section, category.content, category.id, searchTerm);
            }

            glossaryContentElement.appendChild(section);
        });
        lucide.createIcons();
    }

    function renderSectionContent(parentElement, content, searchTerm) {
        const container = document.createElement('div');
        container.className = 'space-y-4 prose prose-invert max-w-none prose-p:text-slate-300 prose-li:text-slate-300 prose-headings:text-slate-100';

        if (content.purpose) {
            const p = document.createElement('p');
            p.innerHTML = highlightText(content.purpose, searchTerm);
            container.appendChild(p);
        }
        if (content.functionText) {
            const p = document.createElement('p');
            p.innerHTML = highlightText(content.functionText, searchTerm);
            container.appendChild(p);
        }

        ['keyComponents', 'polkadotJsApiUsage', 'coreFeatures', 'relationshipWithPolkadot'].forEach(key => {
            if (content[key]) {
                const subSection = content[key];
                const subTitle = document.createElement('h4');
                subTitle.className = 'text-lg font-medium text-slate-200 mt-4 mb-2';
                subTitle.innerHTML = highlightText(subSection.title, searchTerm);
                container.appendChild(subTitle);

                if (subSection.description) {
                    const p = document.createElement('p');
                    p.innerHTML = highlightText(subSection.description, searchTerm);
                    container.appendChild(p);
                }
                if (subSection.list) {
                    const ul = document.createElement('ul');
                    ul.className = 'list-disc list-inside space-y-1 pl-2';
                    subSection.list.forEach(item => {
                        const li = document.createElement('li');
                        if (typeof item === 'string') {
                            li.innerHTML = highlightText(item, searchTerm);
                        } else {
                            li.innerHTML = `<strong class="font-medium text-slate-100">${highlightText(item.name, searchTerm)}:</strong> ${highlightText(item.description, searchTerm)}`;
                        }
                        ul.appendChild(li);
                    });
                    container.appendChild(ul);
                }
            }
        });
        appendSources(container, content.sources, searchTerm);
        parentElement.appendChild(container);
    }

    function renderAccordionSection(parentElement, content, categoryId, searchTerm) {
        const container = document.createElement('div');
        container.className = 'space-y-4 prose prose-invert max-w-none prose-p:text-slate-300';

        if (content.overview) {
            const p = document.createElement('p');
            p.innerHTML = highlightText(content.overview, searchTerm);
            p.className = 'mb-6';
            container.appendChild(p);
        }

        content.steps.forEach((step, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'border border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-pink-500/50'; // Added focus-within for parent styling

            const headerButton = document.createElement('button');
            headerButton.className = 'accordion-header-button w-full flex justify-between items-center p-4 text-left bg-slate-700/50 hover:bg-slate-700 transition-colors focus:outline-none'; // Removed default outline for custom
            headerButton.setAttribute('aria-expanded', 'false');
            headerButton.setAttribute('aria-controls', `${categoryId}-step-${index}`);
            
            const headerTitle = document.createElement('span');
            headerTitle.className = 'font-medium text-slate-100';
            headerTitle.innerHTML = highlightText(step.title, searchTerm);
            headerButton.appendChild(headerTitle);

            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', 'chevron-down');
            icon.className = 'w-5 h-5 text-slate-400 transform transition-transform duration-300 accordion-chevron'; // Added class for easier selection
            headerButton.appendChild(icon);
            
            accordionItem.appendChild(headerButton);

            const contentDiv = document.createElement('div');
            contentDiv.id = `${categoryId}-step-${index}`;
            contentDiv.className = 'accordion-content p-4 bg-slate-800'; // Ensure no Tailwind prose here if we want specific styling
            
            const descriptionP = document.createElement('p');
            descriptionP.className = 'prose prose-sm prose-invert max-w-none'; // Apply prose styles directly to paragraph
            descriptionP.innerHTML = highlightText(step.description, searchTerm);
            contentDiv.appendChild(descriptionP);
            accordionItem.appendChild(contentDiv);

            const toggleAccordion = () => {
                const isExpanded = headerButton.getAttribute('aria-expanded') === 'true';
                headerButton.setAttribute('aria-expanded', String(!isExpanded));
                contentDiv.classList.toggle('open');
                const chevron = headerButton.querySelector('.accordion-chevron');
                if (chevron) {
                    chevron.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
                }
            };
            
            headerButton.addEventListener('click', toggleAccordion);

            headerButton.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleAccordion();
                }
            });
            container.appendChild(accordionItem);
        });
        
        if (content.keyTools) {
            const subTitle = document.createElement('h4');
            subTitle.className = 'text-lg font-medium text-slate-200 mt-6 mb-2';
            subTitle.innerHTML = highlightText(content.keyTools.title, searchTerm);
            container.appendChild(subTitle);

            const ul = document.createElement('ul');
            ul.className = 'list-disc list-inside space-y-1 pl-2';
            content.keyTools.list.forEach(tool => {
                const li = document.createElement('li');
                li.innerHTML = highlightText(tool, searchTerm);
                ul.appendChild(li);
            });
            container.appendChild(ul);
        }

        appendSources(container, content.sources, searchTerm);
        parentElement.appendChild(container);
    }


    function appendSources(parentElement, sources, searchTerm) {
        if (sources && sources.length > 0) {
            const sourcesContainer = document.createElement('div');
            sourcesContainer.className = 'mt-4 pt-3 border-t border-slate-700/50';
            
            const sourcesTitle = document.createElement('h5');
            sourcesTitle.className = 'text-sm font-semibold text-slate-400 mb-1';
            sourcesTitle.textContent = 'Source(s):';
            sourcesContainer.appendChild(sourcesTitle);

            const sourcesList = document.createElement('ul');
            sourcesList.className = 'list-none space-y-1';
            sources.forEach(source => {
                const sourceItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = source.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'text-xs text-slate-500 hover:text-pink-400 transition-colors source-link flex items-center';
                
                const linkIcon = document.createElement('i');
                linkIcon.setAttribute('data-lucide', 'external-link');
                linkIcon.className = 'w-3 h-3 mr-1.5 flex-shrink-0';
                link.appendChild(linkIcon);

                const linkText = document.createElement('span');
                linkText.innerHTML = highlightText(source.text, searchTerm);
                link.appendChild(linkText);
                
                sourceItem.appendChild(link);
                sourcesList.appendChild(sourceItem);
            });
            sourcesContainer.appendChild(sourcesList);
            parentElement.appendChild(sourcesContainer);
        }
    }
});
